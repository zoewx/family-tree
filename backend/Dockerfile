FROM eclipse-temurin:17-jre
WORKDIR /app
COPY build/libs/family-tree-api-1.0.0.jar app.jar
EXPOSE 5010
ENTRYPOINT ["java", "-jar", "app.jar"]
