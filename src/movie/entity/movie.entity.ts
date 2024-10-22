import { Exclude, Expose, Transform } from "class-transformer";

export class Movie {
    id: number;
    title: string; 
    @Transform(
        // ({value}) => 'code factory' genre 값 전부 code facotory로 변환해준다.
        ({value}) => value.toString().toUpperCase(), // 대문자로 변경해준다. 
    )
    genre: string;

}