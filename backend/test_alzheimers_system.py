import requests
import json
from datetime import datetime
import logging
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlzheimersSystemTester:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.test_patients = self._generate_test_patients()

    def _generate_test_patients(self) -> Dict[str, Dict]:
        """Generate test patient data with various risk profiles"""
        return {
            "high_risk": {
                "patient_data": {
                    "demographics": {
                        "age": "75",
                        "gender": "female",
                        "education_years": "12"
                    },
                    "cognitive_tests": {
                        "mmse_score": "23",
                        "clock_drawing_test": "impaired",
                        "verbal_fluency": "10 words"
                    },
                    "medical_history": {
                        "family_history_alzheimers": "yes",
                        "cardiovascular_conditions": "hypertension",
                        "diabetes": "yes"
                    },
                    "symptoms": {
                        "memory_issues": "moderate",
                        "language_difficulties": "mild",
                        "daily_activity_changes": "noticeable"
                    },
                    "biomarkers": {
                        "apoe_genotype": "e4/e4",
                        "blood_markers": {
                            "inflammatory_markers": "elevated",
                            "beta_amyloid": "elevated"
                        }
                    }
                }
            },
            "moderate_risk": {
                "patient_data": {
                    "demographics": {
                        "age": "68",
                        "gender": "male",
                        "education_years": "14"
                    },
                    "cognitive_tests": {
                        "mmse_score": "26",
                        "clock_drawing_test": "slight impairment",
                        "verbal_fluency": "13 words"
                    },
                    "medical_history": {
                        "family_history_alzheimers": "no",
                        "cardiovascular_conditions": "hypertension",
                        "diabetes": "no"
                    },
                    "symptoms": {
                        "memory_issues": "mild",
                        "language_difficulties": "none",
                        "daily_activity_changes": "minimal"
                    },
                    "biomarkers": {
                        "apoe_genotype": "e3/e4",
                        "blood_markers": {
                            "inflammatory_markers": "normal",
                            "beta_amyloid": "slightly elevated"
                        }
                    }
                }
            },
            "low_risk": {
                "patient_data": {
                    "demographics": {
                        "age": "60",
                        "gender": "female",
                        "education_years": "18"
                    },
                    "cognitive_tests": {
                        "mmse_score": "29",
                        "clock_drawing_test": "normal",
                        "verbal_fluency": "18 words"
                    },
                    "medical_history": {
                        "family_history_alzheimers": "no",
                        "cardiovascular_conditions": "none",
                        "diabetes": "no"
                    },
                    "symptoms": {
                        "memory_issues": "none",
                        "language_difficulties": "none",
                        "daily_activity_changes": "none"
                    },
                    "biomarkers": {
                        "apoe_genotype": "e3/e3",
                        "blood_markers": {
                            "inflammatory_markers": "normal",
                            "beta_amyloid": "normal"
                        }
                    }
                }
            }
        }

    def test_connection(self) -> bool:
        """Test connection to the server"""
        try:
            response = requests.get(f"{self.base_url}/api/test-connection")
            if response.status_code == 200:
                logger.info("✓ Server connection successful")
                return True
            else:
                logger.error(f"✗ Server connection failed: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"✗ Server connection error: {str(e)}")
            return False

    def submit_patient_data(self, risk_level: str) -> Dict[str, Any]:
        """Submit patient data and get risk assessment"""
        if risk_level not in self.test_patients:
            raise ValueError(f"Invalid risk level: {risk_level}")

        try:
            response = requests.post(
                f"{self.base_url}/api/health-data",
                json=self.test_patients[risk_level]
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✓ Successfully processed {risk_level} risk patient")
                logger.info(f"Risk Assessment: {json.dumps(result['risk_assessment'], indent=2)}")
                return result
            else:
                logger.error(f"✗ Failed to process patient data: {response.status_code}")
                return {}
        except Exception as e:
            logger.error(f"✗ Error submitting patient data: {str(e)}")
            return {}

    def test_queries(self, patient_result: Dict[str, Any]) -> None:
        """Test various queries on the processed patient data"""
        test_queries = [
            "What are the main risk factors for this patient?",
            "Are there any early warning signs of Alzheimer's?",
            "What lifestyle changes would you recommend?",
            "How does the genetic profile affect the risk assessment?",
            "Compare cognitive test scores with normal ranges"
        ]

        for query in test_queries:
            try:
                response = requests.post(
                    f"{self.base_url}/api/query",
                    json={"query": query}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"\nQuery: {query}")
                    logger.info(f"Results: {json.dumps(result['results'], indent=2)}")
                else:
                    logger.error(f"✗ Query failed: {response.status_code}")
            except Exception as e:
                logger.error(f"✗ Error running query: {str(e)}")

def run_tests():
    """Run all system tests"""
    tester = AlzheimersSystemTester()
    
    # Test 1: Connection
    if not tester.test_connection():
        logger.error("Stopping tests due to connection failure")
        return

    # Test 2: Process different risk profiles
    risk_levels = ["high_risk", "moderate_risk", "low_risk"]
    for risk_level in risk_levels:
        logger.info(f"\nTesting {risk_level} patient profile:")
        result = tester.submit_patient_data(risk_level)
        
        if result:
            # Test 3: Run queries on the processed data
            logger.info(f"\nTesting queries for {risk_level} patient:")
            tester.test_queries(result)

if __name__ == "__main__":
    run_tests()
