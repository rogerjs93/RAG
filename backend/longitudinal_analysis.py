from typing import List, Dict, Any
import numpy as np
from datetime import datetime
import pandas as pd
from sklearn.linear_model import LinearRegression
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LongitudinalAnalysis:
    def __init__(self):
        self.cognitive_metrics = [
            'mmse_score',
            'verbal_fluency',
            'clock_drawing_test'
        ]
        
        self.progression_thresholds = {
            'mmse_score': {
                'rapid_decline': -3,  # points per year
                'moderate_decline': -2,
                'slow_decline': -1
            },
            'verbal_fluency': {
                'rapid_decline': -5,  # words per year
                'moderate_decline': -3,
                'slow_decline': -1
            }
        }

    def analyze_progression(self, patient_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze disease progression from patient history"""
        try:
            # Sort records by timestamp
            sorted_history = sorted(
                patient_history,
                key=lambda x: datetime.fromisoformat(x['timestamp'])
            )

            if len(sorted_history) < 2:
                return {
                    "status": "insufficient_data",
                    "message": "Need at least 2 assessments for progression analysis"
                }

            analysis = {
                "cognitive_decline_rate": self._analyze_cognitive_decline(sorted_history),
                "symptom_progression": self._analyze_symptom_progression(sorted_history),
                "risk_trajectory": self._analyze_risk_trajectory(sorted_history),
                "prediction": self._predict_progression(sorted_history)
            }

            return {
                "status": "success",
                "analysis": analysis,
                "recommendations": self._generate_recommendations(analysis)
            }

        except Exception as e:
            logger.error(f"Error in progression analysis: {str(e)}")
            return {"status": "error", "message": str(e)}

    def _analyze_cognitive_decline(self, history: List[Dict]) -> Dict[str, Any]:
        """Analyze rate of cognitive decline"""
        decline_rates = {}
        
        for metric in self.cognitive_metrics:
            scores = []
            timestamps = []
            
            for record in history:
                try:
                    score = float(record['patient_data']['cognitive_tests'][metric].split()[0])
                    scores.append(score)
                    timestamps.append(datetime.fromisoformat(record['timestamp']))
                except (KeyError, ValueError, AttributeError):
                    continue

            if len(scores) >= 2:
                # Convert timestamps to years from first assessment
                years = [(t - timestamps[0]).days / 365.25 for t in timestamps]
                
                # Calculate rate of change
                if len(scores) == 2:
                    rate = (scores[-1] - scores[0]) / years[-1]
                else:
                    # Use linear regression for more points
                    reg = LinearRegression().fit(
                        np.array(years).reshape(-1, 1),
                        np.array(scores)
                    )
                    rate = reg.coef_[0]

                decline_rates[metric] = {
                    "rate": rate,
                    "severity": self._classify_decline_rate(metric, rate)
                }

        return decline_rates

    def _analyze_symptom_progression(self, history: List[Dict]) -> Dict[str, Any]:
        """Analyze progression of symptoms over time"""
        symptom_progression = {}
        symptom_types = ['memory_issues', 'language_difficulties', 'daily_activity_changes']
        
        for symptom in symptom_types:
            progression = []
            for record in history:
                try:
                    severity = record['patient_data']['symptoms'][symptom]
                    progression.append({
                        'timestamp': record['timestamp'],
                        'severity': severity
                    })
                except KeyError:
                    continue
            
            if progression:
                symptom_progression[symptom] = progression

        return symptom_progression

    def _analyze_risk_trajectory(self, history: List[Dict]) -> Dict[str, Any]:
        """Analyze how risk factors change over time"""
        risk_scores = []
        timestamps = []
        
        for record in history:
            try:
                risk_assessment = record['risk_assessment']
                risk_scores.append({
                    'overall_risk': risk_assessment['overall_risk'],
                    'cognitive_risk': risk_assessment['cognitive_risk'],
                    'genetic_risk': risk_assessment['genetic_risk'],
                    'lifestyle_risk': risk_assessment['lifestyle_risk']
                })
                timestamps.append(datetime.fromisoformat(record['timestamp']))
            except KeyError:
                continue

        if not risk_scores:
            return {"status": "no_risk_data"}

        # Calculate trend
        first_score = risk_scores[0]
        last_score = risk_scores[-1]
        time_diff = (timestamps[-1] - timestamps[0]).days / 365.25

        trends = {}
        for risk_type in first_score.keys():
            change = last_score[risk_type] - first_score[risk_type]
            annual_change = change / time_diff if time_diff > 0 else 0
            
            trends[risk_type] = {
                "initial": first_score[risk_type],
                "current": last_score[risk_type],
                "annual_change": annual_change,
                "trend": "increasing" if annual_change > 0.05 else
                        "decreasing" if annual_change < -0.05 else "stable"
            }

        return trends

    def _predict_progression(self, history: List[Dict]) -> Dict[str, Any]:
        """Predict disease progression based on historical data"""
        try:
            # Extract MMSE scores and timestamps
            mmse_scores = []
            timestamps = []
            
            for record in history:
                try:
                    score = float(record['patient_data']['cognitive_tests']['mmse_score'].split()[0])
                    mmse_scores.append(score)
                    timestamps.append(datetime.fromisoformat(record['timestamp']))
                except (KeyError, ValueError, AttributeError):
                    continue

            if len(mmse_scores) < 2:
                return {"status": "insufficient_data"}

            # Convert timestamps to years from first assessment
            years = np.array([(t - timestamps[0]).days / 365.25 for t in timestamps])
            scores = np.array(mmse_scores)

            # Fit linear regression
            reg = LinearRegression().fit(years.reshape(-1, 1), scores)
            
            # Predict next year
            next_year = np.array([[years[-1] + 1]])
            predicted_score = reg.predict(next_year)[0]

            return {
                "status": "success",
                "current_score": scores[-1],
                "predicted_score_1year": predicted_score,
                "confidence": self._calculate_prediction_confidence(reg, years, scores)
            }

        except Exception as e:
            logger.error(f"Error in progression prediction: {str(e)}")
            return {"status": "error", "message": str(e)}

    def _classify_decline_rate(self, metric: str, rate: float) -> str:
        """Classify the rate of decline for a given metric"""
        if metric not in self.progression_thresholds:
            return "unknown"

        thresholds = self.progression_thresholds[metric]
        
        if rate <= thresholds['rapid_decline']:
            return "rapid"
        elif rate <= thresholds['moderate_decline']:
            return "moderate"
        elif rate <= thresholds['slow_decline']:
            return "slow"
        else:
            return "stable"

    def _calculate_prediction_confidence(self, model: LinearRegression,
                                      X: np.ndarray, y: np.ndarray) -> float:
        """Calculate confidence in prediction based on model fit"""
        try:
            # Use R-squared as base confidence
            r2 = model.score(X.reshape(-1, 1), y)
            
            # Adjust confidence based on number of data points
            n_points = len(X)
            if n_points < 3:
                confidence = r2 * 0.6  # Low confidence with few points
            elif n_points < 5:
                confidence = r2 * 0.8  # Moderate confidence
            else:
                confidence = r2  # Full confidence with many points

            return round(confidence, 2)

        except Exception:
            return 0.0

    def _generate_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on longitudinal analysis"""
        recommendations = []
        
        # Check cognitive decline
        if 'cognitive_decline_rate' in analysis:
            decline_rates = analysis['cognitive_decline_rate']
            for metric, data in decline_rates.items():
                if data['severity'] == 'rapid':
                    recommendations.append(
                        f"Urgent: Rapid decline in {metric}. Immediate medical consultation required."
                    )
                elif data['severity'] == 'moderate':
                    recommendations.append(
                        f"Important: Moderate decline in {metric}. Schedule follow-up assessment."
                    )

        # Check risk trajectory
        if 'risk_trajectory' in analysis:
            trajectory = analysis['risk_trajectory']
            for risk_type, data in trajectory.items():
                if data['trend'] == 'increasing':
                    recommendations.append(
                        f"Monitor: Increasing trend in {risk_type}. Review risk management strategy."
                    )

        # Check predictions
        if 'prediction' in analysis and analysis['prediction']['status'] == 'success':
            pred = analysis['prediction']
            if pred['predicted_score_1year'] < pred['current_score']:
                recommendations.append(
                    "Alert: Cognitive decline predicted. Consider preventive interventions."
                )

        return recommendations
