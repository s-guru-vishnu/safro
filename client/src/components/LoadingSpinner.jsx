const LoadingSpinner = ({ size = 'md', text = '' }) => {
    const sizes = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-2',
        lg: 'w-10 h-10 border-3',
    };

    return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className={`${sizes[size]} border-teal-600 border-t-transparent rounded-full animate-spin`} />
            {text && <p className="text-sm text-gray-500">{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
