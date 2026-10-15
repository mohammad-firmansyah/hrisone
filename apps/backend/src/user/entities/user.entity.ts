import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "../../role/entities/role.entity.js";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    name: string;
    @Column()
    email: string;
    @Column()
    password: string;
    @OneToOne(() => Role)
    @JoinColumn({ name: "role_id" })
    role: Role;
    @Column()
    status: boolean;
    @Column()
    created_by: number;
    @Column()
    updated_by: number;
    @CreateDateColumn()
    created_at: Date;
    @UpdateDateColumn()
    updated_at: Date;
}
