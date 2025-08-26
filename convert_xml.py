import xml.etree.ElementTree as ET
import csv
import os

def convert_icd10_xml_to_csv(xml_file_path, csv_file_path):
    """
    Parses the official ICD-10 ClaML format XML file and converts it to a CSV
    containing the diagnosis code and its preferred description.

    Args:
        xml_file_path (str): The path to the input .xml file.
        csv_file_path (str): The path where the output .csv will be saved.
    """
    try:
        tree = ET.parse(xml_file_path)
        root = tree.getroot()

        # Open the CSV file for writing
        with open(csv_file_path, 'w', newline='', encoding='utf-8') as csvfile:
            csv_writer = csv.writer(csvfile)
            csv_writer.writerow(['code', 'description']) # Write header

            count = 0
            # Find all 'Class' tags which represent diagnosis entries
            for class_tag in root.findall('.//Class'):
                code = class_tag.get('code') # The code is an attribute
                
                # The description is usually in a specific 'Rubric' tag
                rubric_tag = class_tag.find("Rubric[@kind='preferred']")
                if rubric_tag is not None:
                    label_tag = rubric_tag.find('Label')
                    if label_tag is not None and label_tag.text:
                        description = label_tag.text.strip()
                        
                        # Ensure we have both a code and a description
                        if code and description:
                            csv_writer.writerow([code, description])
                            count += 1
        
        if count > 0:
            print(f"Successfully converted {count} records from {xml_file_path} to {csv_file_path}")
        else:
            print("Warning: Conversion finished, but no diagnosis codes were found.")
            print("Please ensure the XML file is the correct ICD-10 ClaML format.")

    except FileNotFoundError:
        print(f"Error: The file {xml_file_path} was not found.")
    except ET.ParseError:
        print(f"Error: The file {xml_file_path} is not a valid XML file.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# --- How to use this script ---
if __name__ == "__main__":
    xml_file = 'icd102019en.xml'
    csv_file = 'icd10_codes.csv'
    convert_icd10_xml_to_csv(xml_file, csv_file)
