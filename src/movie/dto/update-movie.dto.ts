import { IsNotEmpty, IsOptional } from "class-validator";

export class UpdateMovieDto {
    @IsNotEmpty() // title key 값을 입력하면 value 값이 비면 안 된다. 
    @IsOptional() // title을 Key 값으로 안 넣는 건 허용된다. 
    title?: string;

    @IsNotEmpty()
    @IsOptional()
    genre?: string;
}


