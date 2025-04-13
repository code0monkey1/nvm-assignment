import bcrypt from 'bcrypt';

class EncryptionService {
    private readonly SALT_ROUNDS = 10;

    compare = async (
        plainText: string,
        hashedText: string,
    ): Promise<boolean> => {
        return await bcrypt.compare(plainText, hashedText);
    };
    generateHash = async (plainText: string): Promise<string> => {
        return await bcrypt.hash(plainText, this.SALT_ROUNDS);
    };
}

export default EncryptionService;
