import { DataSource } from 'typeorm';

// this is used to clear all database entries before running tests
export const clearDb = async (connection: DataSource) => {
    // get all entities list
    const entities = connection.entityMetadatas;

    for (const entity of entities) {
        const repository = connection.getRepository(entity.name);
        await repository.clear();
    }
};
