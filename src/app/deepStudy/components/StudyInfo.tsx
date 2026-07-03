'use client';

import Icon from '@/ui/Icon/Icon';
import { StudyDetailModel } from '@/types/study';
import Tag from '@/components/Tag';

interface StudyInfoProps {
    study: StudyDetailModel;
}

export default function StudyInfo({ study }: StudyInfoProps) {
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('스터디 링크가 복사되었습니다.');
    };

    return (
        <div className="flex flex-col gap-5">
            <h1 className="text-3xl font-bold text-gray-600 tracking-tight">
                {study.title}
            </h1>

            <p className="text-sm font-medium text-gray-400 max-w-xl leading-relaxed">
                {study.description}
            </p>

            <p className="text-xs font-medium text-gray-400 tracking-wide">
                {study.startDate} ~ {study.endDate}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-base font-bold text-main-50 mr-1">#</span>
                {study.tags.map((tag) => (
                    <Tag
                        key={tag}
                        variant="outline"
                        className="rounded-full border border-main-20 bg-white px-3.5 py-1 text-xs font-medium text-gray-600"
                    >
                        {tag}
                    </Tag>
                ))}
            </div>

            <button
                onClick={handleCopyLink}
                className="flex w-fit items-center gap-2 text-sm font-bold text-main-100 hover:text-main-60 transition-colors mt-2 cursor-pointer"
            >
                <Icon name="link" className="h-4.5 w-4.5 stroke-1" />
                스터디 링크 복사
            </button>
        </div>
    );
}
