'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/storage';
import { User } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, MessageSquare, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  content: string;
  read: boolean;
  complaintId?: number;
  createdAt: string;
}

interface Conversation {
  userId: number;
  userName: string;
  userProfilePic?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    setUser(currentUser);
    loadData(currentUser);
  }, [router]);

  // Auto-open conversation if userId param is provided
  useEffect(() => {
    if (user && allUsers.length > 0 && !selectedConversation) {
      const userIdParam = searchParams.get('userId');
      if (userIdParam) {
        const targetUserId = parseInt(userIdParam);
        
        // Check if conversation exists
        const existingConv = conversations.find(c => c.userId === targetUserId);
        if (existingConv) {
          setSelectedConversation(existingConv);
        } else {
          // Create new conversation
          const targetUser = allUsers.find(u => u.id === targetUserId);
          if (targetUser) {
            setSelectedConversation({
              userId: targetUser.id,
              userName: targetUser.name,  
              userProfilePic: targetUser.profilePicture,
              lastMessage: '',
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0
            });
          }
        }
      }
    }
  }, [searchParams, user, allUsers, conversations, selectedConversation]);

  useEffect(() => {
    if (selectedConversation && user) {
      loadMessages(user.id, selectedConversation.userId);
      // Poll for new messages every 2 seconds (faster for better UX)
      const interval = setInterval(() => {
        loadMessages(user.id, selectedConversation.userId);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async (currentUser: User) => {
    setLoading(true);
    try {
      // Load all users for potential conversations
      const usersRes = await fetch('/api/users?limit=100');
      if (usersRes.ok) {
        const users = await usersRes.json();
        // Filter out current user
        const otherUsers = users.filter((u: User) => u.id !== currentUser.id);
        setAllUsers(otherUsers);
      }

      // Load all messages involving current user
      const [sentRes, receivedRes] = await Promise.all([
        fetch(`/api/messages?sender_id=${currentUser.id}&limit=1000`),
        fetch(`/api/messages?receiver_id=${currentUser.id}&limit=1000`)
      ]);

      if (sentRes.ok && receivedRes.ok) {
        const sentMessages = await sentRes.json();
        const receivedMessages = await receivedRes.json();
        const allMessages = [...sentMessages, ...receivedMessages];

        // Group messages by conversation
        const conversationMap = new Map<number, Conversation>();

        allMessages.forEach((msg: Message) => {
          const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
          const otherUserName = msg.senderId === currentUser.id ? 'User' : msg.senderName;

          if (!conversationMap.has(otherUserId)) {
            conversationMap.set(otherUserId, {
              userId: otherUserId,
              userName: otherUserName,
              lastMessage: msg.content,
              lastMessageTime: msg.createdAt,
              unreadCount: 0
            });
          }

          const conv = conversationMap.get(otherUserId)!;
          
          // Update last message if this message is more recent
          if (new Date(msg.createdAt) > new Date(conv.lastMessageTime)) {
            conv.lastMessage = msg.content;
            conv.lastMessageTime = msg.createdAt;
          }

          // Count unread messages from others
          if (msg.receiverId === currentUser.id && !msg.read) {
            conv.unreadCount++;
          }
        });

        // Fetch user details for each conversation
        const conversationsWithDetails = await Promise.all(
          Array.from(conversationMap.values()).map(async (conv) => {
            const userRes = await fetch(`/api/users?id=${conv.userId}`);
            if (userRes.ok) {
              const userData = await userRes.json();
              return {
                ...conv,
                userName: userData.name,
                userProfilePic: userData.profilePicture
              };
            }
            return conv;
          })
        );

        // Sort by last message time
        conversationsWithDetails.sort((a, b) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );

        setConversations(conversationsWithDetails);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: number, otherUserId: number) => {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        fetch(`/api/messages?sender_id=${userId}&receiver_id=${otherUserId}&limit=1000`),
        fetch(`/api/messages?sender_id=${otherUserId}&receiver_id=${userId}&limit=1000`)
      ]);

      if (sentRes.ok && receivedRes.ok) {
        const sentMessages = await sentRes.json();
        const receivedMessages = await receivedRes.json();
        const allMessages = [...sentMessages, ...receivedMessages];

        // Sort by creation time
        allMessages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        setMessages(allMessages);

        // Mark received messages as read
        for (const msg of receivedMessages) {
          if (!msg.read) {
            await fetch(`/api/messages?id=${msg.id}`, {
              method: 'PATCH'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !messageContent.trim() || sending) return;

    setSending(true);
    const tempMessage = messageContent.trim();
    setMessageContent(''); // Clear immediately for better UX
    
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          senderName: user.name,
          receiverId: selectedConversation.userId,
          content: tempMessage
        })
      });

      if (res.ok) {
        // Immediately add message to UI
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        
        // Refresh conversations list
        if (user) {
          loadData(user);
        }

        // Send notification
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedConversation.userId,
            type: 'new_message',
            message: `New message from ${user.name}: ${tempMessage.substring(0, 50)}${tempMessage.length > 50 ? '...' : ''}`
          })
        });
      } else {
        toast.error('Failed to send message');
        setMessageContent(tempMessage); // Restore message on error
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setMessageContent(tempMessage); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
  };

  const handleNewConversation = (selectedUser: User) => {
    setSelectedConversation({
      userId: selectedUser.id,
      userName: selectedUser.name,
      userProfilePic: selectedUser.profilePicture,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    });
    setSearchQuery(''); // Clear search when starting new conversation
  };

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !conversations.some(conv => conv.userId === u.id)
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <Card className={`lg:col-span-1 ${selectedConversation ? 'hidden lg:block' : ''} overflow-hidden`}>
            <div className="p-4 border-b bg-white">
              <h2 className="text-2xl font-bold mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-20rem)]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.length === 0 && searchQuery === '' && filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-semibold">No conversations yet</p>
                      <p className="text-sm mt-2">Search for users above to start messaging</p>
                    </div>
                  )}

                  {/* Existing Conversations */}
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.userId}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-4 hover:bg-gray-50 transition-colors text-left ${
                        selectedConversation?.userId === conv.userId ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conv.userProfilePic} />
                          <AvatarFallback>{conv.userName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-gray-900 truncate">{conv.userName}</p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(conv.lastMessageTime), 'HH:mm')}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 truncate flex-1">{conv.lastMessage}</p>
                            {conv.unreadCount > 0 && (
                              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-5[20px] text-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Search Results - New Conversations */}
                  {searchQuery && filteredUsers.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-100 text-xs font-semibold text-gray-600 sticky top-0">
                        Start New Conversation
                      </div>
                      {filteredUsers.map((usr) => (
                        <button
                          key={usr.id}
                          onClick={() => handleNewConversation(usr)}
                          className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={usr.profilePicture} />
                              <AvatarFallback>{usr.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900">{usr.name}</p>
                              <p className="text-sm text-gray-500">
                                {usr.role === 'admin' ? 'Admin' : usr.branch || usr.department || usr.role}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className={`lg:col-span-2 flex flex-col ${!selectedConversation ? 'hidden lg:flex' : ''} overflow-hidden`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center space-x-3 bg-white">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.userProfilePic} />
                    <AvatarFallback>{selectedConversation.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{selectedConversation.userName}</p>
                    <p className="text-xs text-green-600">Online</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-gray-50">
                  <div className="space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                      </div>
                    )}
                    {messages.map((msg, index) => {
                      const isSent = msg.senderId === user.id;
                      const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end space-x-2 ${isSent ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isSent && showAvatar && (
                            <Avatar className="h-8 w-8 mb-1">
                              <AvatarImage src={selectedConversation.userProfilePic} />
                              <AvatarFallback>{selectedConversation.userName[0]}</AvatarFallback>
                            </Avatar>
                          )}
                          {!isSent && !showAvatar && <div className="w-8" />}
                          
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isSent
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                            }`}
                          >
                            <p className="warp-break-words whitespace-pre-wrap">{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isSent ? 'text-blue-100' : 'text-gray-400'
                              }`}
                            >
                              {format(new Date(msg.createdAt), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex space-x-2"
                  >
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      disabled={sending}
                      className="flex-1"
                      autoFocus
                    />
                    <Button 
                      type="submit" 
                      disabled={sending || !messageContent.trim()}
                      className="px-6"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold">Select a conversation</p>
                  <p className="text-sm mt-2">Choose a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}