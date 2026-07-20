'use client';

import { useState } from 'react';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import SquareButton from '@/components/SquareButton';
import Icon from '@/ui/Icon/Icon';
import TagButton from '@/components/TagButton';
import Calendar from './Calendar';
import { useStudyRefresh } from '../StudyRefreshContext';

interface CreateStudyModalProps {
    isOpen: boolean;
    onClose?: () => void;
}

const participantOptions = [1, 2, 3, 4, 5, 6];

function CreateStudyModal({ isOpen, onClose }: CreateStudyModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [participants, setParticipants] = useState(0);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [passwordEnabled, setPasswordEnabled] = useState(false);
    const [password, setPassword] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const refetch = useStudyRefresh();

    const isFormValid = Boolean(
        title.trim() &&
        startDate &&
        endDate &&
        tags.length > 0 &&
        (!passwordEnabled || password.trim()),
    );

    const formatDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        return dateStr.replace(/-/g, '.');
    };

    const handleDateSelect = (start: string, end: string) => {
        setStartDate(start);
        setEndDate(end);
    };

    const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
        event.preventDefault();
        const trimmedTag = tagInput.trim();
        if (!trimmedTag) return;

        if (!tags.includes(trimmedTag)) {
            setTags((prevTags) => [...prevTags, trimmedTag]);
        }
        setTagInput('');
    };

    const handleSubmit = async () => {
        if (!isFormValid || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/studies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    startDate,
                    endDate,
                    maxMemberCount: participants,
                    tags,
                    password: passwordEnabled ? password : null,
                }),
            });

            if (res.status === 401) {
                alert('인증 세션이 만료되었습니다. 다시 로그인해 주세요.');
                return;
            }

            if (!res.ok) {
                throw new Error('스터디 생성 실패');
            }

            setTitle('');
            setDescription('');
            setStartDate('');
            setEndDate('');
            setTags([]);
            setPassword('');
            setPasswordEnabled(false);

            refetch();
            onClose?.();
        } catch (error) {
            console.error('스터디 생성 중 오류 발생:', error);
            alert(
                '스터디를 만드는 도중 오류가 발생했습니다. 다시 시도해 주세요.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-110 w-full">
            <Modal.Header title="딥스터디 만들기" />
            <Modal.Body>
                <div className="flex flex-col gap-5 px-1 py-1 overflow-y-auto max-h-[calc(100vh-14rem)] pr-2">
                    {/* 1. 스터디 제목 */}
                    <div className="flex flex-col gap-2 text-sm font-semibold text-gray-00">
                        <span>
                            스터디 제목 <span className="text-red-100">*</span>
                        </span>
                        <Input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="스터디 제목을 입력해주세요"
                            isFull
                            className="placeholder-gray-300"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* 2. 스터디 설명 */}
                    <div className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                        <div className="flex justify-between items-center">
                            <span>스터디 설명</span>
                            <span className="text-xs font-normal text-gray-400">
                                {description.length}/50자
                            </span>
                        </div>
                        <textarea
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            maxLength={50}
                            placeholder="스터디에 대해 간단히 설명해주세요 (50자 이내)"
                            className="w-full min-h-8 h-auto py-2 px-3 text-sm text-gray-600 transition-colors rounded-lg bg-white border border-main-20 focus:outline-none resize-none field-sizing-content"
                            style={
                                {
                                    fieldSizing: 'content',
                                } as React.CSSProperties
                            }
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* 3. 스터디 기간 선택 */}
                    <div className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                        <span>
                            스터디 기간 <span className="text-red-100">*</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsCalendarOpen((prev) => !prev)}
                            className="flex w-full items-center justify-between rounded-lg border border-main-20 bg-white px-3 py-2.5 text-sm font-medium text-gray-300 cursor-pointer hover:border-main-30 transition-colors text-left"
                            disabled={isSubmitting}
                        >
                            <span
                                className={
                                    startDate
                                        ? 'text-gray-700'
                                        : 'text-gray-300'
                                }
                            >
                                {startDate
                                    ? `${formatDisplay(startDate)} ~ ${formatDisplay(endDate)}`
                                    : '날짜를 선택해 주세요'}
                            </span>
                            <Icon
                                name="calendar"
                                className="stroke-main-30 w-5 h-5"
                            />
                        </button>

                        {isCalendarOpen && (
                            <Calendar
                                startDate={startDate}
                                endDate={endDate}
                                onDateSelect={handleDateSelect}
                            />
                        )}
                    </div>

                    {/* 4. 스터디 인원 */}
                    <div className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                        <span>
                            스터디 인원 <span className="text-red-100">*</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {participantOptions.map((option) => (
                                <TagButton
                                    key={option}
                                    selected={participants === option}
                                    onClick={() => setParticipants(option)}
                                    className="text-sm py-1 px-3.5"
                                    disabled={isSubmitting}
                                >
                                    {option}명
                                </TagButton>
                            ))}
                        </div>
                    </div>

                    {/* 5. 해시 태그 */}
                    <div className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                        <span>
                            해시 태그 <span className="text-red-100">*</span>
                        </span>
                        <Input
                            value={tagInput}
                            onChange={(event) =>
                                setTagInput(event.target.value)
                            }
                            onKeyDown={handleTagKeyDown}
                            placeholder="태그 입력 후 엔터 (클릭 시 삭제)"
                            isFull
                            className="placeholder-gray-300"
                            disabled={isSubmitting}
                        />
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1.5 animate-in fade-in duration-150">
                                {tags.map((tag) => (
                                    <TagButton
                                        key={tag}
                                        onClick={() =>
                                            setTags((prevTags) =>
                                                prevTags.filter(
                                                    (prevTag) =>
                                                        prevTag !== tag,
                                                ),
                                            )
                                        }
                                        className="text-sm"
                                        disabled={isSubmitting}
                                    >
                                        {tag}
                                    </TagButton>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* 6. 비밀번호 설정 */}
                    <div className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() =>
                                    setPasswordEnabled((prev) => !prev)
                                }
                                className={`flex h-5 w-5 items-center justify-center rounded-sm border cursor-pointer transition-colors ${
                                    passwordEnabled
                                        ? 'border-main-30 bg-main-30'
                                        : 'border-main-20 bg-white'
                                }`}
                                disabled={isSubmitting}
                            >
                                {passwordEnabled ? (
                                    <Icon
                                        name="check"
                                        className="h-3 w-3 stroke-white"
                                    />
                                ) : null}
                            </button>
                            <span>비밀번호 설정</span>
                        </div>

                        {passwordEnabled && (
                            <Input
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                type="text"
                                placeholder="비밀번호를 입력해주세요"
                                isFull
                                className="placeholder-gray-300"
                                disabled={isSubmitting}
                            />
                        )}
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <SquareButton
                    variant="cancel"
                    onClick={onClose}
                    disabled={isSubmitting}
                >
                    취소
                </SquareButton>
                <SquareButton
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
                >
                    {isSubmitting ? '생성중...' : '확인'}
                </SquareButton>
            </Modal.Footer>
        </Modal>
    );
}

export default CreateStudyModal;
