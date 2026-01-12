import { Tag, Ticket } from 'lucide-react';

const TicketCard = ({ type, price, available, onBuy }) => {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Decorative side accent */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500"></div>
      
      <div className="ml-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Ticket size={18} className="text-blue-500" />
              {type}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Available: {available}</p>
          </div>
          <div className="text-right">
            <span className="block text-xl font-bold text-green-600">${price}</span>
          </div>
        </div>

        {onBuy && (
          <button 
            onClick={onBuy}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            Purchase Ticket
          </button>
        )}
      </div>
    </div>
  );
};

export default TicketCard;