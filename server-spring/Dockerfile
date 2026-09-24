# Multi-stage Dockerfile for Spring Boot Backend on Render / Cloud
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build application
COPY src ./src
RUN mvn clean package -DskipTests -B

# Lightweight Runtime
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 5000
ENV PORT=5000

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
