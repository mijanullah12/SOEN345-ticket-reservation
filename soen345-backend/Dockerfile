# Build and run Spring Boot on Java 21 (matches pom.xml)
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
COPY src ./src
RUN chmod +x mvnw && ./mvnw -B -DskipTests clean package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
