import bcryptjs from 'bcryptjs';
class CredentialService {
    isCorrectPassword = async (password: string, hashedPassword: string) => {
        return await bcryptjs.compare(password, hashedPassword);
    };
}

export default CredentialService;
