package ticketReservation.soen345.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.IndexResolver;
import org.springframework.data.mongodb.core.index.MongoPersistentEntityIndexResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import ticketReservation.soen345.domain.User;

@Configuration
@EnableMongoAuditing
@RequiredArgsConstructor
public class MongoConfig {

    private final MongoTemplate mongoTemplate;
    private final MongoMappingContext mongoMappingContext;

    @PostConstruct
    public void initIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps(User.class);

        ensureAnnotationBasedIndexes(indexOps);
        createPartialUniqueIndexForEmail(indexOps);
        createPartialUniqueIndexForPhone(indexOps);
    }

    private void ensureAnnotationBasedIndexes(IndexOperations indexOps) {
        IndexResolver resolver = new MongoPersistentEntityIndexResolver(mongoMappingContext);
        resolver.resolveIndexFor(User.class).forEach(indexOps::ensureIndex);
    }

    private void createPartialUniqueIndexForEmail(IndexOperations indexOps) {
        Document indexKeys = new Document("email", 1);
        Document partialFilter = new Document("email", new Document("$type", "string"));

        Document indexOptions = new Document()
                .append("unique", true)
                .append("partialFilterExpression", partialFilter)
                .append("name", "email_unique_partial");

        indexOps.ensureIndex(new CompoundIndexDefinition(indexKeys) {
            @Override
            public Document getIndexOptions() {
                return indexOptions;
            }
        });
    }

    private void createPartialUniqueIndexForPhone(IndexOperations indexOps) {
        Document indexKeys = new Document("phone", 1);
        Document partialFilter = new Document("phone", new Document("$type", "string"));

        Document indexOptions = new Document()
                .append("unique", true)
                .append("partialFilterExpression", partialFilter)
                .append("name", "phone_unique_partial");

        indexOps.ensureIndex(new CompoundIndexDefinition(indexKeys) {
            @Override
            public Document getIndexOptions() {
                return indexOptions;
            }
        });
    }
}
