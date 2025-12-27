import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    loading?: boolean;
    className?: string;
    iconColor?: string;
    iconBg?: string;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    loading = false,
    className,
    iconColor = "text-orange-400",
    iconBg = "bg-orange-500/10"
}: StatCardProps) {
    return (
        <Card className={cn(
            "group bg-[#141618] border-white/5 hover:border-white/10 transition-all duration-300 shadow-lg",
            className
        )}>
            <CardContent className="p-6 flex items-start justify-between">
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                            {title}
                        </p>
                        {loading ? (
                            <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />
                        ) : (
                            <h3 className="text-3xl font-bold text-white tracking-tight">
                                {value === 'NaN' || (typeof value === 'number' && isNaN(value)) ? '0' : value}
                            </h3>
                        )}

                        {trend && !loading && (
                            <div className={cn(
                                "flex items-center gap-1 mt-2 text-xs font-medium",
                                trend.isPositive ? "text-green-400" : "text-red-400"
                            )}>
                                <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
                                <span className="text-muted-foreground ml-1">vs mes anterior</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className={cn("p-3 rounded-xl transition-colors group-hover:scale-110 duration-300 h-fit", iconBg)}>
                    <Icon className={cn("w-5 h-5", iconColor)} />
                </div>
            </CardContent>
        </Card>
    );
}
