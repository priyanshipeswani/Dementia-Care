import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Shield, Edit, Trash2 } from 'lucide-react';
import { FamilyMember } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
}

export function FamilyMemberCard({ member, onEdit, onDelete }: FamilyMemberCardProps) {
  const { settings } = useAccessibility();

  return (
    <motion.div
      initial={!settings.reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="elevated" className="p-6 h-full">
        <div className="flex flex-col h-full">
          {/* Header with profile image and basic info */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <img
                src={member.profileImage}
                alt={`${member.name}'s profile`}
                className="w-20 h-20 rounded-full object-cover border-4 border-blue-200 shadow-md"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/80x80/CCCCCC/666666?text=Photo';
                }}
              />
              {member.isEmergencyContact && (
                <div 
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 shadow-md"
                  title="Emergency Contact"
                >
                  <Shield size={16} className="text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-grow min-w-0">
              <h3 className="text-2xl font-bold text-gray-900 mb-1 truncate">
                {member.name}
              </h3>
              <p className="text-lg text-blue-600 font-medium mb-2">
                {member.relationship}
              </p>
              <p className="text-sm text-gray-500">
                Added {member.addedAt.toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Contact information */}
          <div className="space-y-3 mb-4 flex-grow">
            {member.contactInfo.phone && (
              <div className="flex items-center gap-3 text-gray-700">
                <Phone size={20} className="text-blue-500 flex-shrink-0" />
                <span className="text-lg">{member.contactInfo.phone}</span>
              </div>
            )}
            
            {member.contactInfo.email && (
              <div className="flex items-center gap-3 text-gray-700">
                <Mail size={20} className="text-blue-500 flex-shrink-0" />
                <span className="text-lg truncate">{member.contactInfo.email}</span>
              </div>
            )}
            
            {member.contactInfo.address && (
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin size={20} className="text-blue-500 flex-shrink-0" />
                <span className="text-lg">{member.contactInfo.address}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {member.notes && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 text-base leading-relaxed">
                {member.notes}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              size="small"
              onClick={() => onEdit(member)}
              className="flex-1"
              aria-label={`Edit ${member.name}'s information`}
            >
              <Edit size={20} />
              Edit
            </Button>
            
            <Button
              variant="ghost"
              size="small"
              onClick={() => onDelete(member.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label={`Delete ${member.name} from family list`}
            >
              <Trash2 size={20} />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}