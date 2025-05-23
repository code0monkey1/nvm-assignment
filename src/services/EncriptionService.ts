import bcryptjs from 'bcryptjs';

class EncryptionService {
    private readonly SALT_ROUNDS = 10;

    compare = async (
        plainText: string,
        hashedText: string,
    ): Promise<boolean> => {
        return await bcryptjs.compare(plainText, hashedText);
    };
    generateHash = async (plainText: string): Promise<string> => {
        return await bcryptjs.hash(plainText, this.SALT_ROUNDS);
    };
}

export default EncryptionService;
