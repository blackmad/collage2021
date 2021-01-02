
import sqlite3
from coco import coco
from mrcnn import visualize
import mrcnn.model as modellib
from mrcnn import utils
import os
import sys
import random
import math
import numpy as np
import skimage.io
import matplotlib
import matplotlib.pyplot as plt

# Root directory of the project
ROOT_DIR = os.path.abspath("./")

# Import Mask RCNN
# sys.path.append(ROOT_DIR)  # To find local version of the library
# Import COCO config
sys.path.append(os.path.join(ROOT_DIR, "coco/"))  # To find local version

# Directory to save logs and trained model
MODEL_DIR = os.path.join(ROOT_DIR, "logs")

# Local path to trained weights file
COCO_MODEL_PATH = os.path.join(ROOT_DIR, "mask_rcnn_coco.h5")
# Download COCO trained weights from Releases if needed
if not os.path.exists(COCO_MODEL_PATH):
    print('downloading trained weights')
    utils.download_trained_weights(COCO_MODEL_PATH)


class InferenceConfig(coco.CocoConfig):
    # Set batch size to 1 since we'll be running inference on
    # one image at a time. Batch size = GPU_COUNT * IMAGES_PER_GPU
    GPU_COUNT = 1
    IMAGES_PER_GPU = 1


config = InferenceConfig()
config.display()


# Create model object in inference mode.
model = modellib.MaskRCNN(mode="inference", model_dir=MODEL_DIR, config=config)

# Load weights trained on MS-COCO
model.load_weights(COCO_MODEL_PATH, by_name=True)

class_names = ['BG', 'person', 'bicycle', 'car', 'motorcycle', 'airplane',
               'bus', 'train', 'truck', 'boat', 'traffic light',
               'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird',
               'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear',
               'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie',
               'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
               'kite', 'baseball bat', 'baseball glove', 'skateboard',
               'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
               'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
               'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
               'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed',
               'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote',
               'keyboard', 'cell phone', 'microwave', 'oven', 'toaster',
               'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors',
               'teddy bear', 'hair drier', 'toothbrush']


def process_image(id, filename, image):
    outdir = os.path.join('objects')
    if not os.path.isdir(outdir):
        os.mkdir(outdir)

    # Run detection
    results = model.detect([image], verbose=1)

    # extract objects
    r = results[0]

    import imageio
    N = r['rois'].shape[0]
    scores = r['scores']
    outputs = []
    for i in range(N):
        masked_image = image.copy()
        # print(len(image))
        # print(len(image[0][0]))
        class_id = r['class_ids'][i]
        score = scores[i] if scores is not None else None
        label = class_names[class_id]
        alpha = 1.0
        mask = r['masks'][:, :, i]
        box = r['rois'][i]
        # print(box)
        y1, x1, y2, x2 = box
        # for c in range(3):
        # 	masked_image[:, :, c] = np.where(mask == False,
        # 		0,
        # 		image[:, :, c])
        if len(image[0][0]) == 3:
            masked_image = np.dstack(
                (masked_image, np.zeros((len(image), len(image[0])))))

        masked_image[:, :, 3] = np.where(mask == False,
                                         0,
                                         255)

        fileparts = os.path.basename(filename).split('.')
        filefrag = '_'.join(fileparts[:-1])
        ext = 'png'
        newFilename = '%s-%s-%s-%s.%s' % (id, label, i, score, ext)
        # print(newFilename)
        # imageio.imwrite(newFilename, masked_image)
        output_filepath = os.path.join(outdir, newFilename)
        imageio.imwrite(output_filepath, masked_image[y1:y2, x1:x2])
        outputs.append(output_filepath)

        sql = ''' INSERT INTO objects(id,label,instanceIndex,score,filename,height,width)
              VALUES(?,?,?,?,?,?,?) '''
        cur = conn.cursor()
        print(y1, y2, x1, x2)
        print('SCORE', score, type(score))
        cur.execute(sql, (id, label, i, score.item(), newFilename,
                          int(y2-y1), int(x2-x1)))
        conn.commit()

    return outputs

    # visualize.display_instances(image, r['rois'], r['masks'], r['class_ids'],
    # class_names, )


def process(id):
    filename = f'../scraper/raw/{id}.jpg'
    print('processing %s' % filename)
    image = skimage.io.imread(filename)
    return process_image(id, filename, image)


conn = sqlite3.connect('../scraper/db.sqlite')
c = conn.cursor()

c.execute("""CREATE TABLE IF NOT EXISTS objects(id TEXT,label TEXT,instanceIndex INTEGER,score REAL,filename TEXT,height INTEGER,width INTEGER)""")

sql = "SELECT id FROM downloaded WHERE datetime(downloaded_at) >= datetime('now', '-24 hours')"
for row in c.execute(sql):
    id = row[0]
    print('DOING THIS ID', id)

    c2 = conn.cursor()
    objects = c2.execute(f'''SELECT COUNT(*) FROM objects WHERE id="{id}"''')
    cur_result = c2.fetchone()
    print(cur_result, id)
    if cur_result[0] > 0:
        print("skipping already done")
        continue
    process(id)
