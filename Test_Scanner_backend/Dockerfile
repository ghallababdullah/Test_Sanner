FROM eclipse-temurin:24-jdk AS build

WORKDIR /app

COPY Test_Scanner_backend/gradlew Test_Scanner_backend/gradlew.bat Test_Scanner_backend/build.gradle Test_Scanner_backend/settings.gradle ./
COPY Test_Scanner_backend/gradle ./gradle
COPY Test_Scanner_backend/src ./src

RUN chmod +x ./gradlew
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:24-jre

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY Python_CV_OCR /opt/python_cv_ocr
COPY Python_CV_OCR/requirements-preview.txt /tmp/requirements-preview.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements-preview.txt

COPY --from=build /app/build/libs/*.jar /app/app.jar

ENV PYTHON_CMD=python3
ENV PYTHON_PROJECT_DIR=/opt/python_cv_ocr

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
