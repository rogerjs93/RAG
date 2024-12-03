import random
import json
from datetime import datetime, timedelta
import numpy as np

def generate_sleep_stages():
    # Generate realistic sleep stage percentages that sum to 100%
    total = 100.0
    awake = round(random.uniform(5, 10), 1)
    light = round(random.uniform(45, 55), 1)
    deep = round(random.uniform(15, 25), 1)
    rem = round(total - (awake + light + deep), 1)  # Ensure total is 100%
    
    total_sleep_hours = random.uniform(6, 9)
    
    # Convert percentages to hours and minutes
    def percentage_to_time(percentage):
        hours = int((percentage/100) * total_sleep_hours)
        minutes = int(((percentage/100) * total_sleep_hours % 1) * 60)
        return {"Hours": hours, "Minutes": minutes}
    
    return {
        "Time Awake": percentage_to_time(awake),
        "Light Sleep": percentage_to_time(light),
        "Deep Sleep": percentage_to_time(deep),
        "REM Sleep": percentage_to_time(rem),
        "Total Sleep Time": round(total_sleep_hours, 1),
        "Sleep Quality Score": random.randint(5, 10)
    }

def generate_body_composition():
    # Generate realistic body composition data
    height = random.uniform(150, 190)  # cm
    weight = random.uniform(50, 100)   # kg
    bmi = round(weight / ((height/100) ** 2), 1)
    
    # Determine BMI category and description
    if bmi < 18.5:
        category = "Underweight"
        description = "Below healthy weight range"
    elif 18.5 <= bmi < 25:
        category = "Athletic Build"
        description = "High muscle mass, healthy body fat"
    elif 25 <= bmi < 30:
        category = "Overweight"
        description = "Above healthy weight range"
    else:
        category = "Obese"
        description = "Significantly above healthy weight range"
    
    return {
        "Height": round(height, 1),
        "Weight": round(weight, 1),
        "Body Fat": round(random.uniform(10, 30), 1),
        "Muscle Mass": round(random.uniform(30, 45), 1),
        "Body Water": round(random.uniform(50, 65), 1),
        "Bone Mass": round(random.uniform(2, 4), 1),
        "BMI": bmi,
        "Category": category,
        "Description": description
    }

def generate_vital_signs():
    return {
        "Blood Pressure": {
            "Systolic": random.randint(90, 140),
            "Diastolic": random.randint(60, 90)
        },
        "Oxygen Saturation": round(random.uniform(95, 100), 1),
        "Pulse Rate": random.randint(60, 100),
        "Temperature": round(random.uniform(36.1, 37.2), 1)
    }

def generate_health_record(user_id=None):
    timestamp = datetime.now() - timedelta(days=random.randint(0, 30))
    
    return {
        "user_id": user_id or random.randint(1000, 9999),
        "timestamp": timestamp.isoformat(),
        "vital_signs": generate_vital_signs(),
        "sleep_data": generate_sleep_stages(),
        "body_composition": generate_body_composition()
    }

def generate_dataset(num_samples=1000, num_users=50):
    """
    Generate a dataset with multiple samples per user over time
    """
    dataset = []
    for user_id in range(1, num_users + 1):
        # Generate random number of samples per user
        user_samples = random.randint(15, 25)
        for _ in range(user_samples):
            record = generate_health_record(user_id)
            dataset.append(record)
    
    # Sort by timestamp
    dataset.sort(key=lambda x: x['timestamp'])
    return dataset

if __name__ == "__main__":
    # Generate dataset
    data = generate_dataset()
    
    # Save to file
    output_file = "health_data_samples.json"
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Generated {len(data)} health records and saved to {output_file}")
    print("Sample record:")
    print(json.dumps(data[0], indent=2))
