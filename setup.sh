#!/bin/bash
# For Ubuntu18.04, Node.js 12.18.0, PM2 4.4.0

echo "User-Data script start"

export HOME=/home/ssm-user
export STAGE=production
export CONCURRENCY=5

src_dir="$HOME/backend_app"
yarn_path=$(which yarn)
pm2_path=$(which pm2)
api_filename=timespace-setup.tar
s3_src_path=s3://booking.storage.private/prod/timespace/api

echo "src_dir: ${src_dir}"
echo "yarn_path: ${yarn_path}"
echo "pm2_path: ${pm2_path}"
echo "api_filename: ${api_filename}"
echo "s3_src_path: ${s3_src_path}"

aws s3 cp ${s3_src_path}/${api_filename} "$HOME"

mkdir "${src_dir}"
echo "[Start Unzip BuildFile]"
tar xvf "$HOME/${api_filename}" -C "${src_dir}/"
echo "[End Unzip BuildFile]"

cd "${src_dir}/" || exit

${yarn_path} install --production

cd "${src_dir}/" || exit
\cp -f .env.production .env
${pm2_path} start yarn -i 0 --name jd-timespace-api -- start

# 예가 있어야 인스턴스 구동되었을떄 PM2에서 확인 가능
chown ssm-user:ssm-user $HOME.pm2/rpc.sock $HOME.pm2/pub.sock