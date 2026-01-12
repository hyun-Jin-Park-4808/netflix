import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

export class BaseTable {
  @CreateDateColumn()
  @Exclude() // 해당 컬럼 조회할 때 제외
  @ApiHideProperty() // swagger에서 제외
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude()
  @ApiHideProperty() // swagger에서 제외
  updatedAt: Date;

  @VersionColumn()
  @Exclude()
  @ApiHideProperty() // swagger에서 제외
  version: number;
}
