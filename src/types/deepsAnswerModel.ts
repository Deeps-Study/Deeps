export interface MyAnswerModel {
    answerId: string;
    content: string;
}

export interface OtherAnswerModel {
    answerId: string;
    author: { nickname: string; image: string };
    content: string;
    recommendCount: number;
    recommended: boolean;
}
