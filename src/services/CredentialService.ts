import bcrypt from 'bcrypt';
class CredentialService {
    isCorrectPassword = async (password: string, hashedPassword: string) => {
        return await bcrypt.compare(password, hashedPassword);
    };
}

export default CredentialService;
