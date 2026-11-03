from tabla import app  # Import your Flask app instance
from flask_frozen import Freezer

freezer = Freezer(app)

if __name__ == '__main__':
    freezer.freeze()