import { Exclude } from 'class-transformer';
import { BaseTable } from 'src/common/entity/base-table.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum Role {
  admin, // admin에 대한 값은 0이 매핑된다.
  paidUser, // 1
  user, // 2
}

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  @Exclude({
    toPlainOnly: true, // 응답할 때 해당 컬럼을 제외한다. toClassOnly는 요청을 할 때 해당 컬럼을 제외하는 옵션
  })
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.user,
  })
  role: Role;
}
