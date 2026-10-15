import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../user/entities/user.entity.js";

@Entity()
export class Attendance {
    @PrimaryGeneratedColumn()
    id: number;
    @OneToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;
    @CreateDateColumn()
    created_at: Date;
    @UpdateDateColumn()
    updated_at: Date;
    @Column()
    created_by: number;
    @Column()
    updated_by: number;
    @Column()
    location: string;
    @Column()
    image: string;
    @Column()
    notes: string; 
    @Column()
    clock_in: Date;
    @Column()
    clock_out: Date;
}
