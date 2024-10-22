import { Exclude, Expose } from "class-transformer";

@Exclude() // 보안에 민감한 클래스인 경우 전체를 Exclude를 해놓고, 노출 가능한 속성한 Expose를 할 수 있다. 
export class Movie {
    id: number;
    title: string;

    
    // @Exclude() // 직렬화할 때 이 값을 노출시키지 않겠다. 
    @Expose() // 기본 설정이 Expose()인데, 클래스 전체가 Exclude()가 된 경우 사용한다. 
    genre: string;

    @Expose()
    get description() {
        return `id: ${this.id} title: ${this.title}`;
    }
}