pm2 delete runa
rm -rf runa
mkdir -p runa-build
cd runa-build
degit https://github.com/yaskevich/runa#main
cd front
npm install
npm run build
cd ../back
npm install
cd ../../
mv runa-build/back runa
mv runa-build/front/dist runa/public
rm -rf runa-build
cp runa.env runa/.env
cd runa
# # pm2-runtime ecosystem.config.js
pm2 start ecosystem.config.cjs
pm2 save
