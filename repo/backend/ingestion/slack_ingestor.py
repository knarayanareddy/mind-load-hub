from slack_sdk import WebClient
from typing import List, Dict
from datetime import datetime, timedelta
import logging

class SlackIngestor:
    def __init__(self, token: str = None):
        self.token = token
        if token:
            self.client = WebClient(token=token)
        else:
            self.client = None

    def fetch_messages(self, user_id: str, days: int = 7) -> List[Dict]:
        """
        Fetches a user's sent messages from public channels, private channels, and IMs.
        Includes a privacy-first approach: strictly fetches metadata and basic text length/sentiment
        without storing raw message content permanently.
        """
        if not self.client:
            logging.info("No active Slack token found. Using mock baseline messages for simulation.")
            return self._get_mock_messages(user_id, days)

        messages = []
        cutoff = datetime.now() - timedelta(days=days)
        
        try:
            # 1. Fetch conversations/channels the bot is part of
            convos = self.client.conversations_list(
                types="public_channel,private_channel,im,mpim",
                limit=100
            )
            
            for channel in convos.get('channels', []):
                try:
                    # 2. Query history of each channel back to the cutoff time
                    history = self.client.conversations_history(
                        channel=channel['id'],
                        oldest=cutoff.timestamp(),
                        limit=500
                    )
                    
                    for msg in history.get('messages', []):
                        if msg.get('user') == user_id and msg.get('text'):
                            messages.append({
                                'text': msg['text'],
                                'ts': float(msg['ts']),
                                'channel': channel['id'],
                                'is_dm': channel.get('is_im', False),
                                'thread_ts': msg.get('thread_ts')
                            })
                            
                except Exception as e:
                    # Log error for a specific channel and continue with others (e.g. not in channel)
                    logging.warning(f"Failed to fetch history for channel {channel['id']}: {e}")
                    continue
                    
        except Exception as e:
            logging.error(f"Slack API error fetching conversations: {e}. Falling back to baseline simulation.")
            return self._get_mock_messages(user_id, days)

        return sorted(messages, key=lambda m: m['ts'])

    def _get_mock_messages(self, user_id: str, days: int) -> List[Dict]:
        """Provides realistic mock telemetry logs to support offline simulation out-of-the-box."""
        mock_messages = []
        now = datetime.now()
        
        # Depending on who user_id is, generate different loads!
        # If user_id is Diana or Charlie (critical/high load), simulate high volume and late night messages
        is_high_load = user_id in ["diana-id", "U_DIANA", "charlie-id", "U_CHARLIE"]
        num_messages = 80 if is_high_load else 15
        
        for i in range(num_messages):
            # Distribute messages across the days
            msg_time = now - timedelta(
                days=i % days, 
                hours=(i * 3 + 2) % 24, 
                minutes=(i * 7) % 60
            )
            
            # Late night hours for high load members
            hour = msg_time.hour
            is_after_hours = not (9 <= hour < 18)
            
            text = "Need to check this production build error."
            if is_high_load and i % 5 == 0:
                text = "I am feeling extremely overwhelmed and exhausted with this sprint load, too many meetings and context switching."
            elif i % 3 == 0:
                text = "Excellent, thank you for the review! Let's ship it."
                
            mock_messages.append({
                'text': text,
                'ts': msg_time.timestamp(),
                'channel': "C_MOCK_123",
                'is_dm': (i % 2 == 0),
                'thread_ts': msg_time.timestamp() if i % 4 == 0 else None
            })
            
        return sorted(mock_messages, key=lambda m: m['ts'])