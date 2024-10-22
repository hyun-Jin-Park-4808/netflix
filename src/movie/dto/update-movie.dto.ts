import { Contains, Equals, IsAlphanumeric, IsArray, IsBoolean, IsDateString, IsDefined, IsDivisibleBy, IsEmpty, IsEnum, IsInt, IsNegative, IsNotEmpty, IsNotIn, IsNumber, IsOptional, IsPositive, IsString, Min, Max, NotContains, IsCreditCard, IsHexColor, MaxLength, MinLength, IsUUID, IsLatLong, ValidatorConstraintInterface, ValidationArguments, ValidatorConstraint, Validate, ValidationOptions, registerDecorator } from "class-validator";

enum MovieGenre {
    Fantasy = 'fantasy',
    Action = 'action',
}

@ValidatorConstraint({
    async: true, // 비동기로도 설정할 수 있다. 
})
class PasswordValidator implements ValidatorConstraintInterface {
    validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        // 비밀번호 길이는 4-8
        return value.length > 4 && value.length < 8;
    }
    defaultMessage?(validationArguments?: ValidationArguments): string {
        return '비밀번호의 길이는 4~8자 여야 합니다. 입력된 비밀번호: ($value)';
    }
}

function IsPasswordValid(validationOptions?: ValidationOptions) {
    return function(object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: PasswordValidator
        });
    }
}

export class UpdateMovieDto {
    @IsNotEmpty() // title key 값을 입력하면 value 값이 비면 안 된다. 
    @IsOptional() // title을 Key 값으로 안 넣는 건 허용된다. 
    title?: string;

    @IsNotEmpty()
    @IsOptional()
    genre?: string;

    // @IsDefined() // null || undefined 면 에러 발생 
    // @IsOptional() // 이 자체만으로는 유용하지 않다. 
    // @IsDefined()와 함께 사용하면 test에 값이 들어오면 나머지 validator와 함께 사용하도록 하고,
    // test 값 자체가 정의되지 않았다면 @IsOptional로 인해 다른 vlaidator들을 실행하지 않는다. 
    // @Equals('code factory') - test 값으로 code factory만 들어가야 한다.
    // @NotEquals('code factory) - test 값이 code factory면 안 된다.
    // @IsEmpty() //  null || undefined || '' 이어야 한다. 
    // @IsNotEmpty() //  null || undefined || '' 이면 안 된다.
    // @IsIn(['action', 'fantasy']) // test는 action이나 fantasy여야 한다. 
    // @IsNotIn(['action', 'fantasy']) // test는 action이나 fantasy면 안 된다. 
    // @IsBoolean()
    // @IsString()
    // @IsNumber()
    // @IsInt()
    // @IsDivisibleBy(5) // 5로 나눌 수 있는 값인가, 0, 5, 10, .. 
    // @IsPositive() // 양수인가 
    // @IsNegative() // 음수인가 
    // @Min(100) // 100 이상 값만 가능
    // @Max(200) // 200 이하 값만 가능
    // // @Contains('code factory') // 해당 문자를 담고 있느가 
    // @NotContains('code factory') // 해당 문자를 포함하지 않아야 한다.
    // @IsAlphanumeric() // 알파벳과 숫자로만 이뤄져 있는가 
    // @IsCreditCard() // 카드 숫자의 유형인가
    // @IsHexColor() // 색깔을 표현하는 헥스 방식인가
    // @MaxLength(16) // 최대 길이가 16이어야 한다.
    // @MinLength(4) // 최소 길이가 4자여야 한다. 
    // @IsUUID() // uuid 형식인가?
    // @IsLatLong() // 위도 경도 형식인가? "40.7184, -74.000"
    @IsPasswordValid({
        message: '다른 에러 메시지도 보낼 수 있다.'
    })
    test: string;

    // @IsArray()
    // testArray: string[];

    // @IsEnum(MovieGenre)
    // testEnum: string; // fantasy, action으로 넣어줘야 함. 

    // @IsDateString()
    // testDate: string; // "testDate": "2024-07-07T12:00:00", 날짜까지만 넣어도 됨. 
}


