import os
from flask import Flask, render_template
import pandas as pd
import glob

app = Flask(__name__)
ROOT = "./tabla/"

MESSAGES = [
    "Ko ljubav sadi, ne boji se gladi",
    "Radna akcija - narodna reakcija",
    "Kreči, kreči, kreči - tamnu prošlost leči",
    "Čisti, čisti, čisti - samo dobre misli"
]

@app.route('/about.html')
def about():
    all_posts = pd.read_csv(ROOT+"links_extracted.csv")
    all_posts = all_posts[all_posts["date"]>='2026-10-25']
    all_posts["account"] = all_posts["owner"].apply(lambda x: "@"+x)
    all_posts["description"] = all_posts["caption"]
    all_posts["post_url"] = all_posts["link"]
    all_post_dict = all_posts[["date", "account", "description", "post_url"]].to_dict("records")
    print(all_post_dict)
    return render_template('about.html',
                            messages = MESSAGES, 
                            posts = all_post_dict)

@app.route('/predlozi.html')
def nominate():
    return render_template('predlozi.html',
                            messages = MESSAGES)


@app.route('/')
@app.route('/index.html')
def index():
    video_dir = f'{ROOT}static/videos'
    vides_df = pd.read_csv((f"{ROOT}/links_extracted.csv"))
    video_items = []

    for i, row in vides_df.iterrows():
        video_item = {}
        shortcode = row["shortcode"]
        account = row["account"]
        post_url = row["link"]
        video_path = glob.glob(f"{ROOT}/static/videos/{shortcode}/small.mp4")
        if len(video_path) == 0:
            continue
        print(video_path)
        video_path = "/".join(video_path[0].split("/")[-4:])
        video_item["post_url"] = post_url
        video_item["username"] = "@"+account
        video_item["profile_url"] = "/".join(post_url.split("/")[:-3])
        video_item["video_path"] = video_path
        video_items.append(video_item)
    
    songs = ["/static/music/vquo.mp3"]

    return render_template('index.html', 
                            videos=video_items, 
                            songs = songs,
                            messages = MESSAGES)

if __name__ == '__main__':
    app.run(debug=True)