import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../user/entities/user.entity.js";

// Decimal columns come back from mysql2 as strings; convert to numbers.
const decimalToNumber = {
    to: (v?: number | null) => v,
    from: (v?: string | null) => (v == null ? null : Number(v)),
};

@Entity()
@Index(["user", "clock_in"])
export class Attendance {
    @PrimaryGeneratedColumn()
    id: number;
    // Many attendance rows per user (was OneToOne, which forced user_id UNIQUE).
    @ManyToOne(() => User, { nullable: false })
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
    @Column({ type: "varchar", length: 20, default: "WFH" })
    type: string;
    @Column({ type: "varchar", length: 500 })
    notes: string;

    @Column({ type: "datetime" })
    clock_in: Date;
    @Column({ type: "decimal", precision: 10, scale: 7, transformer: decimalToNumber })
    clock_in_latitude: number;
    @Column({ type: "decimal", precision: 10, scale: 7, transformer: decimalToNumber })
    clock_in_longitude: number;
    // Server-generated filename (UUID + extension), never user-supplied.
    @Column({ type: "varchar", length: 64, select: false })
    clock_in_image: string;

    @Column({ type: "datetime", nullable: true })
    clock_out: Date | null;
    @Column({ type: "decimal", precision: 10, scale: 7, nullable: true, transformer: decimalToNumber })
    clock_out_latitude: number | null;
    @Column({ type: "decimal", precision: 10, scale: 7, nullable: true, transformer: decimalToNumber })
    clock_out_longitude: number | null;
    @Column({ type: "varchar", length: 64, nullable: true, select: false })
    clock_out_image: string | null;
}
