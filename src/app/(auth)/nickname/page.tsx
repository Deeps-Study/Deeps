'use client';
import Input from '@/common/Input';
import RoundButton from '@/common/RoundButton';
import { useState } from 'react';

const inputConfig = {
    id: 'nickname',
    name: 'nickname',
    placeholder: '닉네임을 입력해주세요.',
};

export default function NicknamePage() {
    const [nickname, setNickname] = useState('');
    const isValid = nickname.trim().length >= 2;

    return (
        <>
            <div className="w-125 h-78.5 pt-11 pb-14 px-12 border border-main-10 shadow-mint rounded-[40px] bg-white">
                <form className="flex flex-col h-full justify-between">
                    <span className="text-main-100 text-xl font-bold text-center">
                        안녕하세요! 닉네임을 알려주세요
                    </span>

                    <div className="flex flex-col gap-2">
                        <p className="text-gray-600 text-base font-bold text-left">
                            닉네임 입력
                        </p>

                        <Input
                            {...inputConfig}
                            className={`transition-all duration-100 ${isValid ? `shadow-mint` : `shadow-none`}`}
                            value={nickname}
                            onChange={(e) => {
                                setNickname(e.target.value);
                            }}
                        ></Input>
                    </div>

                    <RoundButton
                        variant="complete"
                        isFull
                        type="submit"
                        disabled={!isValid}
                    >
                        완료
                    </RoundButton>
                </form>
            </div>
        </>
    );
}
