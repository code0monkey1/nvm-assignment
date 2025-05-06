import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Tenant } from './Tenant';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    password: string;

    @Column({ unique: true })
    email: string;

    @Column()
    role: string;

    @ManyToOne(() => Tenant)
    tenant: Tenant;
}
