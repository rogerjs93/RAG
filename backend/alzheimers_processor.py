from typing import Dict, List, Any, Optional
import numpy as np
from datetime import datetime
from rag_processor import RAGProcessor
from longitudinal_analysis import LongitudinalAnalysis
import logging

logger = logging.getLogger(__name__)

class AlzheimersProcessor:
    def __init__(self):
        self.rag = RAGProcessor()
        self.longitudinal = LongitudinalAnalysis()
        self.risk_factors = {
            'age': {'weight': 0.2, 'high_risk': 65},
            'family_history': {'weight': 0.15, 'high_risk': True},
            'apoe_e4': {'weight': 0.2, 'high_risk': True},
            'cognitive_decline': {'weight': 0.25, 'high_risk': True},
            'cardiovascular': {'weight': 0.1, 'high_risk': True},
            'education': {'weight': 0.1, 'high_risk': False}
        }

    def process_patient_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            # Add timestamp if not present
            if 'timestamp' not in data:
                data['timestamp'] = datetime.utcnow().isoformat()

            # Extract patient data
            demographics = data.get('patient_data', {}).get('demographics', {})
            cognitive = data.get('patient_data', {}).get('cognitive_tests', {})
            medical = data.get('patient_data', {}).get('medical_history', {})
            symptoms = data.get('patient_data', {}).get('symptoms', {})
            biomarkers = data.get('patient_data', {}).get('biomarkers', {})

            # Calculate risk scores
            risk_assessment = self._calculate_risk_scores(
                demographics, cognitive, medical, symptoms, biomarkers
            )

            # Add risk assessment to data
            enriched_data = {
                **data,
                'risk_assessment': risk_assessment,
                'processed_timestamp': datetime.utcnow().isoformat()
            }

            # Get patient history
            patient_history = self._get_patient_history(data)
            
            # Perform longitudinal analysis if history exists
            if patient_history:
                patient_history.append(enriched_data)
                longitudinal_analysis = self.longitudinal.analyze_progression(patient_history)
                enriched_data['longitudinal_analysis'] = longitudinal_analysis

            # Store in RAG system
            self.rag.process_health_data(enriched_data)

            return enriched_data

        except Exception as e:
            raise Exception(f"Error processing Alzheimer's data: {str(e)}")

    def _get_patient_history(self, current_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Retrieve patient's historical data"""
        try:
            # This would typically query your MongoDB collection
            # For now, returning empty list - implement actual DB query
            return []
        except Exception as e:
            logger.error(f"Error retrieving patient history: {str(e)}")
            return []

    def _calculate_risk_scores(
        self,
        demographics: Dict,
        cognitive: Dict,
        medical: Dict,
        symptoms: Dict,
        biomarkers: Dict
    ) -> Dict[str, Any]:
        """Calculate various risk scores based on patient data"""
        
        risk_scores = {
            'overall_risk': 0.0,
            'cognitive_risk': self._assess_cognitive_risk(cognitive, symptoms),
            'genetic_risk': self._assess_genetic_risk(biomarkers, medical),
            'lifestyle_risk': self._assess_lifestyle_risk(demographics, medical),
            'warning_signs': self._identify_warning_signs(cognitive, symptoms),
            'recommendations': []
        }

        # Calculate overall risk
        risk_scores['overall_risk'] = (
            risk_scores['cognitive_risk'] * 0.4 +
            risk_scores['genetic_risk'] * 0.3 +
            risk_scores['lifestyle_risk'] * 0.3
        )

        # Generate recommendations
        risk_scores['recommendations'] = self._generate_recommendations(risk_scores)

        return risk_scores

    def _assess_cognitive_risk(self, cognitive: Dict, symptoms: Dict) -> float:
        """Assess cognitive risk based on test scores and symptoms"""
        risk_score = 0.0
        
        # MMSE Score analysis (30 is max score)
        mmse = float(cognitive.get('mmse_score', '30').split()[0])
        if mmse < 24:
            risk_score += 0.4
        elif mmse < 27:
            risk_score += 0.2

        # Verbal fluency analysis
        verbal = float(cognitive.get('verbal_fluency', '0').split()[0])
        if verbal < 12:
            risk_score += 0.3
        elif verbal < 15:
            risk_score += 0.15

        # Symptom analysis
        memory_issues = symptoms.get('memory_issues', 'none')
        if memory_issues == 'severe':
            risk_score += 0.3
        elif memory_issues == 'moderate':
            risk_score += 0.2
        elif memory_issues == 'mild':
            risk_score += 0.1

        return min(risk_score, 1.0)

    def _assess_genetic_risk(self, biomarkers: Dict, medical: Dict) -> float:
        """Assess genetic risk based on biomarkers and family history"""
        risk_score = 0.0

        # APOE genotype analysis
        apoe = biomarkers.get('apoe_genotype', '').lower()
        if 'e4/e4' in apoe:
            risk_score += 0.5
        elif 'e4' in apoe:
            risk_score += 0.3

        # Family history analysis
        if medical.get('family_history_alzheimers', '').lower() == 'yes':
            risk_score += 0.3

        # Blood markers analysis
        blood_markers = biomarkers.get('blood_markers', {})
        if blood_markers.get('beta_amyloid', '').lower() == 'elevated':
            risk_score += 0.2

        return min(risk_score, 1.0)

    def _assess_lifestyle_risk(self, demographics: Dict, medical: Dict) -> float:
        """Assess lifestyle and demographic risk factors"""
        risk_score = 0.0

        # Age analysis
        age = int(demographics.get('age', '0'))
        if age >= 65:
            risk_score += 0.3
        elif age >= 55:
            risk_score += 0.15

        # Education (protective factor)
        education = int(demographics.get('education_years', '0'))
        if education >= 16:
            risk_score -= 0.1
        elif education >= 12:
            risk_score -= 0.05

        # Cardiovascular conditions
        cardio = medical.get('cardiovascular_conditions', '').lower()
        if 'hypertension' in cardio or 'heart disease' in cardio:
            risk_score += 0.2

        return min(max(risk_score, 0.0), 1.0)

    def _identify_warning_signs(self, cognitive: Dict, symptoms: Dict) -> List[str]:
        """Identify specific warning signs from cognitive tests and symptoms"""
        warnings = []

        # Cognitive test warnings
        mmse = float(cognitive.get('mmse_score', '30').split()[0])
        if mmse < 24:
            warnings.append("Significant cognitive impairment detected in MMSE score")
        elif mmse < 27:
            warnings.append("Mild cognitive impairment detected in MMSE score")

        # Symptom-based warnings
        memory = symptoms.get('memory_issues', 'none').lower()
        if memory in ['moderate', 'severe']:
            warnings.append("Significant memory issues reported")
        elif memory == 'mild':
            warnings.append("Early signs of memory issues detected")

        language = symptoms.get('language_difficulties', 'none').lower()
        if language != 'none':
            warnings.append("Language difficulties present")

        daily = symptoms.get('daily_activity_changes', 'none').lower()
        if daily != 'none':
            warnings.append("Changes in daily activities observed")

        return warnings

    def _generate_recommendations(self, risk_scores: Dict) -> List[str]:
        """Generate personalized recommendations based on risk assessment"""
        recommendations = []

        # High overall risk recommendations
        if risk_scores['overall_risk'] > 0.7:
            recommendations.extend([
                "Immediate consultation with a neurologist recommended",
                "Consider comprehensive neuropsychological testing",
                "Regular cognitive monitoring advised"
            ])
        elif risk_scores['overall_risk'] > 0.4:
            recommendations.extend([
                "Schedule follow-up cognitive assessments",
                "Consider lifestyle modifications",
                "Monitor cognitive changes closely"
            ])

        # Cognitive-specific recommendations
        if risk_scores['cognitive_risk'] > 0.6:
            recommendations.extend([
                "Engage in cognitive stimulation activities",
                "Consider cognitive rehabilitation programs",
                "Regular memory exercises recommended"
            ])

        # Lifestyle recommendations
        if risk_scores['lifestyle_risk'] > 0.5:
            recommendations.extend([
                "Increase physical activity levels",
                "Maintain social engagement",
                "Consider Mediterranean diet adoption",
                "Regular cardiovascular health check-ups"
            ])

        return recommendations

    def query_patient_insights(self, query: str, top_k: int = 3) -> List[Dict]:
        """Query the RAG system for patient insights"""
        return self.rag.retrieve_similar(query, top_k)
