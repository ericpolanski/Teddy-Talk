import React, { useState } from 'react';
import Button from './Button';

export default function ChildInfoForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, age, phoneNumber });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-md shadow-md">
      <div className="mb-4">
        <label className="block text-gray-700">
          Child's Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">
          Child's Age:
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">
          Parent's Phone Number:
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
          />
        </label>
      </div>
      <Button type="submit" className="bg-blue-400">
        Submit
      </Button>
    </form>
  );
}