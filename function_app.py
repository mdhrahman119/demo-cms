# In function_app.py

import logging
import io
from PIL import Image
import azure.functions as func

app = func.FunctionApp()

@app.blob_trigger(
    arg_name="inputblob",
    path="patient-documents/{name}",
    connection="clinicstoragesaas2025_STORAGE"
)
@app.blob_output(
    arg_name="outputblob",
    path="compressed-documents/{name}",
    connection="clinicstoragesaas2025_STORAGE"
)
def CompressImage(inputblob: func.InputStream, outputblob: func.Out[bytes]):
    logging.info(f"--- Function Triggered ---")
    logging.info(f"Processing blob: {inputblob.name}, Size: {inputblob.length} Bytes")

    try:
        image_bytes = inputblob.read()
        image = Image.open(io.BytesIO(image_bytes))

        output_buffer = io.BytesIO()
        image.save(output_buffer, format='JPEG', quality=85)
        compressed_image_bytes = output_buffer.getvalue()

        outputblob.set(compressed_image_bytes)

        logging.info(f"Successfully compressed {inputblob.name}. New size: {len(compressed_image_bytes)} Bytes")

    except Exception as e:
        logging.error(f"ERROR compressing {inputblob.name}: {e}")