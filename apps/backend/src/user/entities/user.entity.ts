import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "../../role/entities/role.entity.js";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    name: string;
    @Column({ unique: true })
    email: string;
    // scrypt hash in the form "scrypt$N$r$p$salt$hash". Never select this
    // outside of the login check.
    @Column({ select: false })
    password: string;
    // Many users share one role (was OneToOne, which forced role_id UNIQUE).
    @ManyToOne(() => Role, { nullable: false })
    @JoinColumn({ name: "role_id" })
    role: Role;
    @Column()
    status: boolean;
    // Bumped on logout / deactivation. JWTs carry the version they were issued
    // with, so bumping it invalidates every outstanding session for the user.
    @Column({ default: 0 })
    session_version: number;
    @Column()
    created_by: number;
    @Column()
    updated_by: number;
    @CreateDateColumn()
    created_at: Date;
    @UpdateDateColumn()
    updated_at: Date;
}
