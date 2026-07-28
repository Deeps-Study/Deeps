import { createContext, useContext } from 'react';

const RefreshContext = createContext<(() => void) | undefined>(undefined);

export const useStudyRefresh = () => {
    const context = useContext(RefreshContext);
    if (!context)
        throw new Error('반드시 StudyRefreshProvider 내부에서 사용하세요.');
    return context;
};

export const StudyRefreshProvider = RefreshContext.Provider;
