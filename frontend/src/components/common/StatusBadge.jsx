import React from 'react';

const StatusBadge = ({ status }) => {
    // Normalize status to lowercase to handle different DB formats
    const s = status ? status.toLowerCase() : 'unknown';

    const getStyles = (status) => {
        switch (status) {
            // Success / Good States
            case 'verified':
            case 'approved':
            case 'active':
            case 'completed':
            case 'paid':
            case 'accepted':
                return 'bg-green-100 text-green-800 border-green-200';
            
            // Warning / Action Needed
            case 'pending':
            case 'consideration':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            
            // Error / Bad States
            case 'rejected':
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            
            // Negotiation
            case 'negotiating':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            
            // Roles
            case 'manager':
            case 'sponsor':
            case 'client':
            case 'employee':
                return 'bg-blue-50 text-blue-700 border-blue-200';

            case 'chief_coordinator':
                return 'bg-gray-800 text-white border-gray-600';

            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${getStyles(s)}`}>
            {status || 'Unknown'}
        </span>
    );
};

export default StatusBadge;