
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
import tensorflow as tf
try:
    model = tf.keras.models.load_model('../model_best.keras')
    print(f"Input Shape: {model.input_shape}")
    print(f"Output Shape: {model.output_shape}")
    # Try to see if we can find class names in config
    print(f"Config: {model.get_config().keys()}")
except Exception as e:
    print(f"Error loading model: {e}")
