from backend.models.signals import CognitiveLoadInput
from typing import List

class BurnoutPredictor:
    def predict(self, data: CognitiveLoadInput, cl_score: float, historical_scores: List[float] = None) -> float:
        if historical_scores is None:
            historical_scores = []
            
        # 1. Base Sigmoid Risk Probability (Midpoint at 60, scale factor 0.1)
        base_risk = 1.0 / (1.0 + 2.71828 ** -(0.1 * (cl_score - 60.0)))
        
        # 2. Sustained Load Multiplier (from past 14 days scores > 70)
        days_high = sum(1 for s in historical_scores[-14:] if s > 70)
        sustained_multiplier = 1.0 + (days_high * 0.05)
        
        # 3. Sentiment Degradation Multiplier (1.3 if sentiment or message length trend is degrading)
        sentiment_mult = 1.0
        if (data.communication.sentiment_trend == "DEGRADING" or 
            data.communication.message_length_trend == "DEGRADING"):
            sentiment_mult = 1.3
            
        # 4. After-Hours Multiplier (1.2 if late night meetings / after 6pm meetings > 2)
        afterhours_mult = 1.0
        if data.temporal.meetings_after_6pm > 2:
            afterhours_mult = 1.2
            
        # Compound Risk
        risk = base_risk * sustained_multiplier * sentiment_mult * afterhours_mult
        
        # Convert to percentage and cap at 100.0%
        return min(100.0, max(0.0, round(risk * 100.0, 1)))