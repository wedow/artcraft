#!/bin/bash

ffmpeg -i ./$1/videos/step1.mp4 \
  -f lavfi \
  -i anullsrc \
  -max_muxing_queue_size 999999 \
  -vf select='gte(n\,1)',scale=1024:576 \
  -c:v libx264 \
  -c:a aac \
  -shortest \
  -pix_fmt yuv420p \
  -f mp4 ./$1/videos/tmp0.mp4;
