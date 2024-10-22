import { IsNotEmpty } from "class-validator";

export class createMovieDto {
    @IsNotEmpty()
    title: string;

    @IsNotEmpty()
    genre: string;
}