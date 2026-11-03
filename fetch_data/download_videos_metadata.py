from bs4 import BeautifulSoup
import pandas as pd
import instaloader
from pathlib import Path
import os
import glob

ROOT = "./tabla/"

def download_instagram_video(shortcode):
    # Initialize Instaloader
    L = instaloader.Instaloader(
        download_pictures=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False
    )

    # Ensure output directory exists
    output_dir = f"{ROOT}static/videos/{shortcode}"
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    try:
        # Fetch post data and download
        post = instaloader.Post.from_shortcode(L.context, shortcode)
        post_date = post.date_utc       # Date and time (UTC)
        post_caption = post.caption     # Description / Caption
        owner = post.owner_username     # Optional: Author handle
        downloaded_video = None
        # if file exists, skip it's download!
        existing_files = glob.glob(str(output_dir)+"/*_UTC.mp4")
        if len(existing_files)>0:
            downloaded_video = existing_files[0]
        elif post.is_video:
            # This downloads the target video into a folder named after the shortcode
            L.download_post(post, target=Path(output_dir))
            downloaded_videos = glob.glob(str(output_dir)+"/*_UTC.mp4")
            if len(downloaded_videos) > 0: downloaded_video = downloaded_videos[0]
        else:
            print(f"Skipping {shortcode}: Post is not a video.")
        print("Download process completed!")
        return {"date": post_date, 
                "caption": post_caption, 
                "owner": owner, 
                "vid_path":downloaded_video}

    except Exception as e:
        print(f"Error downloading {shortcode}: {e}")
    return None

    
def reduce_video_size(shortcode):
    output_dir = f"{ROOT}static/videos/{shortcode}"
    in_video = glob.glob(output_dir+"/*_UTC.mp4")
    if len(in_video) == 0:
        return None
    in_video = in_video[0]
    out_video = output_dir+"/small.mp4"
    if Path(out_video).exists():
        return out_video
    print(out_video)
    cmd = f"ffmpeg -i {in_video} \
            -vf \"scale=-2:720\" \
            -c:v libx264 \
            -profile:v main \
            -pix_fmt yuv420p \
            -crf 30 \
            -preset slow \
            -an \
            -movflags +faststart \
            {out_video}"
    os.system(cmd)
    return out_video

video_links = []
with open("./fetch_data/instagram_saved_links.txt", "r") as fh:
    video_links = [v.replace("\n", "") for v in fh.readlines()]

short_codes = [link.split("/")[-2] for link in video_links] 

metadata = []
for sc in short_codes:
    tmp = download_instagram_video(sc)
    metadata.append(tmp)

metafata_df = pd.DataFrame(metadata)
metafata_df["shortcode"] = short_codes
# metafata_df.to_csv("my_collection_df.csv", index=False)
# adapt this for new videos to be just added to the list, wothout fetching all old ones

# save videos into a smaller format
'''
for sc in short_codes:
    reduce_video_size(sc)
'''

metafata_df = pd.read_csv("fetch_data/my_collection_df.csv")
metafata_df["link"] = video_links
metafata_df["account"] = metafata_df["owner"]

metafata_df.to_csv("tabla/links_extracted.csv", index=False)
