docker build -t ecm_consulting/mankevich-victor .

docker run -d -p 8080:8080 --rm --name dockerize-vuejs-app ecm_consulting/mankevich-victor
