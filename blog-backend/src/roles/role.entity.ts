// src/roles/role.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // PRIMARY_ADMIN, SECONDARY_ADMIN, MEMBER
}
